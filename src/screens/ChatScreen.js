import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../src/services/supabaseClient";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

const ChatComponent = ({ isAdmin }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Get initial user
    getCurrentUser();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    // Initial messages fetch
    if (isAdmin) {
      fetchUsers();
    } else {
      fetchMessages();
    }

    // Set up real-time subscription
    const messageSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
      messageSubscription?.unsubscribe();
    };
  }, [isAdmin]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", currentUser.id)
        .groupBy("sender_id");

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      const userIds = data.map((item) => item.sender_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
        return;
      }

      setUsers(profiles);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  async function fetchMessages(userId = null) {
    try {
      if (!currentUser) return;

      let query = supabase
        .from("messages")
        .select(
          `
        *,
        sender:profiles!sender_id(id, name),
        receiver:profiles!receiver_id(id, name)
      `
        )
        .order("created_at", { ascending: true });

      if (userId) {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      } else {
        query = query.or(
          `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !currentUser) return;

    try {
      setLoading(true);

      const receiverId = isAdmin ? selectedUser.id : null;

      const { error } = await supabase.from("messages").insert([
        {
          content: newMessage.trim(),
          sender_id: currentUser.id,
          receiver_id: receiverId,
        },
      ]);

      if (error) throw error;

      setNewMessage("");
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  }

  const renderMessage = ({ item }) => {
    const isOwnMessage = currentUser && item.sender_id === currentUser.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageSender}>
          {item.sender?.name || "Unknown"}
        </Text>
        <Text
          style={[
            styles.messageContent,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {item.content}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userContainer}
      onPress={() => {
        setSelectedUser(item);
        fetchMessages(item.id);
      }}
    >
      <Text style={styles.userName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Text>Please sign in to view messages</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAdmin && !selectedUser ? (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.usersList}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
        />
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 10,
  },
  usersList: {
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#FF0000",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e9ecef",
  },
  messageSender: {
    fontSize: 12,
    color: "#000",
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
  },
  ownMessageText: {
    color: "#ffffff",
  },
  otherMessageText: {
    color: "#000000",
  },
  messageTime: {
    fontSize: 10,
    color: "#000",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#FF0000",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  userContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  userName: {
    fontSize: 16,
    color: "#000",
  },
});

export default ChatComponent;
